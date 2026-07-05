import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import quote, urljoin
import re
from typing import  Dict, Optional
from constants.domains_constants import OPENVC_BASE_URL
 
 
import time
import random
import requests
from bs4 import BeautifulSoup
 
HEADERS_LIST = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        "Accept-Language": "en-US,en;q=0.8",
        "Referer": "https://www.google.com/",
    },
]
 
 
def safe_request(url):
    try:
        headers = random.choice(HEADERS_LIST)
        response = requests.get(url, headers=headers, timeout=20)
        if response.status_code == 200:
            return response
        else:
            response.raise_for_status()
    except Exception as e:
        print(f"⚠️ Attempt failed: {e}")
    return None
 
 
class CompanyInvestorScraper:
    """
    Scraper to find investors for a given company name
    Searches multiple free sources: OpenVC, web search, public data
    """
 
    def __init__(self):
        self.base_url = "https://www.openvc.app"
        self.investors_url = "https://www.openvc.app/fund/"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.base_urls = {
            "openvc": "https://www.openvc.app",
            "crunchbase_free": "https://www.crunchbase.com/organization",
        }
 
    def scrape_domain_investor_list(self, domain):
        url = f"{OPENVC_BASE_URL}{domain}"
        print(f"\n🔍 Scraping {domain.upper()} investors from: {url}")
        print("-" * 60)
 
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
 
            soup = BeautifulSoup(response.content, "html.parser")
            investors = []
 
            # Look for investor cards/links
            # Pattern 1: Links to fund pages
            fund_links = soup.find_all("a", href=True)
            investors = []
            for link in fund_links:
                href = link["href"]
                # Select first div that likely holds the firm name
                firm_div = link.find("div", id="invOverflow")
                if firm_div:
                    name = firm_div.get_text(strip=True)
                else:
                    # fallback if structure differs
                    name = (
                        link.find("div").get_text(strip=True)
                        if link.find("div")
                        else link.get_text(strip=True)
                    )
                # Filter by OpenVC investor profile pattern
                if (
                    "fund" in href
                    or "profile" in href
                    or "/investor/" in href
                    or "/invest/" in href
                ) and len(name) > 2:
                    investor_url = urljoin(self.base_url, href)
                    investors.append(
                        {"name": name, "url": investor_url, "domain": domain}
                    )
            # Remove duplicates while preserving order
            seen = set()
            unique_investors = []
            for inv in investors:
                if inv["name"] not in seen:
                    seen.add(inv["name"])
                    unique_investors.append(inv)
 
            print(f"✅ Found {len(unique_investors)} unique {domain} investors")
            return unique_investors
 
        except Exception as e:
            print(f"❌ Error scraping {domain} list: {str(e)}")
            return []
 
    def scrape_domain_investors_full(self, domain, max_investors=None, delay=2):
        # First, get the list
        investor_list = self.scrape_domain_investor_list(domain)
 
        if not investor_list:
            return []
 
        # Limit if specified
        if max_investors:
            investor_list = investor_list[:max_investors]
 
        print(f"\n📊 Fetching detailed info for {len(investor_list)} investors...")
        print("-" * 60)
 
        detailed_investors = []
        total = len(investor_list)
 
        for i, inv in enumerate(investor_list, 1):
            print(f"[{i}/{total}] {inv['name']}...", end=" ")
 
            details = self.get_investor_details(
                f"{self.investors_url}{inv['name']}", inv["name"]
            )
            if details:
                details["domain"] = domain
                detailed_investors.append(details)
                print("✅")
            else:
                print("❌")
 
            # Rate limiting
            if i < total:
                time.sleep(delay)
 
        print("-" * 60)
        print(f"✅ Successfully scraped {len(detailed_investors)} detailed profiles")
 
        return detailed_investors
 
    def get_investor_details(
        self, investor_url: str, investor_name: str
    ) -> Optional[Dict]:
        """
        Scrape detailed investor information from profile page
 
        Args:
            investor_url: URL to investor profile
            investor_name: Name of the investor
 
        Returns:
            Dictionary with investor details
        """
        try:
            response = safe_request(investor_url)
 
            if not response:
                print(f"  ❌ Skipping {investor_name}: failed after retries.")
                return None
 
            soup = BeautifulSoup(response.text, "html.parser")
 
            details = {
                "name": investor_name,
                "url": investor_url,
                "description": "",
                "location": "",
                "target_countries": [],
                "stages": [],
                "check_size": "",
                "fund_stages": [],
                "fund_req": "",
                "sectors": [],
                "website": "",
                "linkedin": "",
                "twitter": "",
                "email": "",
                "portfolio_companies": [],
            }
 
            # Get clean page text (excluding script tags)
            for script in soup(["script", "style", "noscript"]):
                script.decompose()
 
            page_text = soup.get_text()
 
            # --- DESCRIPTION ---
 
            description_keywords = ["who we are"]
 
            for keyword in description_keywords:
                label = soup.find(string=re.compile(keyword, re.I))
                if label:
                    # Get the next paragraph or div after the label
                    next_el = label.find_parent().find_next("p")
                    if not next_el:
                        next_el = label.find_parent().find_next("div")
                    if next_el:
                        desc_text = next_el.get_text(strip=True)
                        if len(desc_text) > 20 and "cookie" not in desc_text.lower():
                            # Heuristic: check if it's an address (location-like)
                            if any(char.isdigit() for char in desc_text) and (
                                "," in desc_text
                                or any(
                                    word in desc_text.lower()
                                    for word in [
                                        "street",
                                        "st.",
                                        "road",
                                        "avenue",
                                        "city",
                                        "country",
                                        "buenos",
                                        "india",
                                        "usa",
                                        "uk",
                                    ]
                                )
                            ):
                                details["location"] = desc_text
                            else:
                                details["description"] = desc_text
                            break
            fund_tables = soup.find_all("table", class_="fundDetail")
 
            if fund_tables:
                for table in fund_tables:
                    rows = table.find_all("tr")
                    for row in rows:
                        tds = row.find_all("td")
                        if len(tds) < 2:
                            continue
 
                        key = tds[0].get_text(strip=True).lower()
 
                        # Extract full text content (preserve inner <br> spacing)
                        value = (
                            tds[1]
                            .get_text(separator=" ", strip=True)
                            .replace("\xa0", " ")
                            .strip()
                        )
 
                        # --- Description extraction ---
                        if any(
                            kw in key
                            for kw in ["who we are", "about", "about us", "description"]
                        ):
                            if len(value) > 20 and not any(
                                w in value.lower()
                                for w in ["street", "road", "avenue", "bldg", "coimbra"]
                            ):
                                details["description"] = value
                            continue
 
                        # --- Location extraction ---
                        if any(
                            kw in key
                            for kw in [
                                "location",
                                "address",
                                "hq",
                                "headquarters",
                                "global hq",
                            ]
                        ):
                            loc_text = (
                                tds[1]
                                .get_text(separator=" ", strip=True)
                                .replace("\xa0", " ")
                                .strip()
                            )
                            details["location"] = loc_text
                            continue
 
                        # --- Value add (optional, sometimes informative) ---
                        if "value add" in key:
                            details["value_add"] = value
                            continue
 
                        # --- Funding requirements ---
                        if "funding" in key and "requirement" in key:
                            details["fund_req"] = value
                            continue
 
                        # --- Check size ---
                        if "check size" in key:
                            details["check_size"] = value
                            continue
 
                        # --- Target countries ---
                        if "target countries" in key:
                            countries = re.split(r"[,/|]", value)
                            details["target_countries"] = [
                                c.strip() for c in countries if len(c.strip()) > 1
                            ]
                            continue
 
                        # --- Stages ---
                        if "stage" in key:
                            stages = re.split(r"[,/|]", value)
                            details["stages"] = [
                                s.strip().title() for s in stages if len(s.strip()) > 1
                            ]
                            continue
 
            # --- LOCATION / TARGET COUNTRIES ---
            # Look for "Target Countries" or "Location" labels
            location_keywords = [
                "target countries",
                "location",
                "headquarters",
                "based in",
                "hq",
            ]
 
            for keyword in location_keywords:
                label = soup.find(string=re.compile(keyword, re.I))
                if label:
                    parent = label.find_parent()
                    if parent:
                        # Get sibling or child elements
                        value_el = parent.find_next_sibling() or parent
 
                        # Extract country/location names
                        locations = []
                        for span in value_el.find_all(["span", "div", "p"]):
                            loc_text = span.get_text(strip=True)
                            if (
                                loc_text
                                and len(loc_text) > 2
                                and "modal" not in loc_text.lower()
                            ):
                                locations.append(loc_text)
 
                        if locations:
                            if "target" in keyword or "countries" in keyword:
                                details["target_countries"] = locations
                            else:
                                details["location"] = ", ".join(locations)
                            break
 
            # Fallback: regex search for location
            if not details["location"]:
                location_pattern = (
                    r"(?:based in|located in|headquarters in)\s+([A-Z][a-zA-Z\s,]+)"
                )
                match = re.search(location_pattern, page_text)
                if match:
                    details["location"] = match.group(1).strip()
 
            # --- INVESTMENT STAGES ---
            stage_label = soup.find(string=re.compile(r"investment\s+stage", re.I))
            if stage_label:
                parent = stage_label.find_parent()
                if parent:
                    stage_container = parent.find_next_sibling() or parent
                    stage_texts = []
 
                    for elem in stage_container.find_all(["span", "div", "li"]):
                        stage_text = elem.get_text(strip=True)
                        if stage_text and len(stage_text) < 50:  # Avoid long text
                            stage_texts.append(stage_text.title())
 
                    details["stages"] = stage_texts
 
            # Fallback: search for common stage keywords
            if not details["stages"]:
                stage_keywords = [
                    "Pre-Seed",
                    "Seed",
                    "Series A",
                    "Series B",
                    "Series C",
                    "Growth",
                    "Late Stage",
                ]
                found_stages = []
                for stage in stage_keywords:
                    if stage.lower() in page_text.lower():
                        found_stages.append(stage)
                if found_stages:
                    details["stages"] = found_stages
 
            # --- funding STAGES ---
            stage_label = soup.find(string=re.compile(r"funding\s+stages", re.I))
            if stage_label:
                parent = stage_label.find_parent()
                if parent:
                    stage_container = parent.find_next_sibling() or parent
                    stage_texts = []
 
                    for elem in stage_container.find_all(["span", "div", "li"]):
                        stage_text = elem.get_text(strip=True)
                        if stage_text and len(stage_text) < 50:  # Avoid long text
                            stage_texts.append(stage_text.title())
 
                    details["fund_stages"] = stage_texts
 
            # Fallback: search for common stage keywords
            if not details["fund_stages"]:
                stage_keywords = ["Growth", "Scaling", "Early Revenue", "Prototype"]
                found_stages = []
                for stage in stage_keywords:
                    if stage.lower() in page_text.lower():
                        found_stages.append(stage)
                if found_stages:
                    details["fund_stages"] = found_stages
 
            description_keywords = ["funding requirements"]
 
            for keyword in description_keywords:
                label = soup.find(string=re.compile(keyword, re.I))
                if label:
                    # Get the next paragraph or div after the label
                    next_el = label.find_parent().find_next("p")
                    if not next_el:
                        next_el = label.find_parent().find_next("div")
                    if next_el:
                        desc_text = next_el.get_text(strip=True)
                        if len(desc_text) > 20 and "cookie" not in desc_text.lower():
                            details["fund_req"] = desc_text
                            break
 
            # Fallback: get first meaningful paragraph
            if not details["fund_req"]:
                for p in soup.find_all("p"):
                    text = p.get_text(strip=True)
                    if (
                        len(text) > 50
                        and "cookie" not in text.lower()
                        and "modal" not in text.lower()
                    ):
                        details["fund_req"] = text
                        break
 
            # --- CHECK SIZE ---
            check_label = soup.find(string=re.compile(r"check\s+size", re.I))
            if check_label:
                parent = check_label.find_parent()
                if parent:
                    value_el = parent.find_next_sibling() or parent
                    check_text = value_el.get_text(strip=True)
                    # Extract only the value part
                    if ":" in check_text:
                        details["check_size"] = check_text.split(":")[-1].strip()
                    else:
                        details["check_size"] = check_text
 
            # Fallback: regex for dollar amounts
            if not details["check_size"] or details["check_size"] == "Check size":
                check_patterns = [
                    r"\$[\d,]+[KkMm]?\s*[-–to]+\s*\$[\d,]+[KkMm]?",
                    r"\$[\d,]+(?:K|M|million|thousand)",
                ]
                for pattern in check_patterns:
                    match = re.search(pattern, page_text)
                    if match:
                        details["check_size"] = match.group(0)
                        break
 
            # --- SECTORS ---
            sector_label = soup.find(string=re.compile(r"sector|focus|industry", re.I))
            if sector_label:
                parent = sector_label.find_parent()
                if parent:
                    sector_container = parent.find_next_sibling() or parent
                    sectors = []
                    for elem in sector_container.find_all(["span", "div", "li"]):
                        sector_text = elem.get_text(strip=True)
                        if sector_text and len(sector_text) < 50:
                            sectors.append(sector_text)
                    details["sectors"] = sectors
 
            social_links = soup.select("a.fund-social-btn[href]")
 
            for link in social_links:
                href = link["href"].strip()
 
                if "linkedin.com" in href:
                    details["linkedin"] = href
                elif "twitter.com" in href or "x.com" in href:
                    details["twitter"] = href
                elif href.startswith("http") and "openvc.app" not in href:
                    if not any(
                        social in href
                        for social in ["linkedin", "twitter", "facebook", "instagram"]
                    ):
                        details["website"] = href
 
            # Fallback: scan all links carefully
            if not details["website"]:
                for link in soup.find_all("a", href=True):
                    href = link["href"]
                    if (
                        href.startswith("http")
                        and "openvc.app" not in href
                        and not any(
                            social in href
                            for social in [
                                "linkedin",
                                "twitter",
                                "facebook",
                                "instagram",
                            ]
                        )
                        and not any(
                            ignore in href
                            for ignore in ["google", "mailto", "javascript"]
                        )
                    ):
                        details["website"] = href
                        break
 
            # --- EMAIL ---
            email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
            emails = re.findall(email_pattern, page_text)
            # Filter out common false positives
            valid_emails = [
                e for e in emails if "example.com" not in e and "test.com" not in e
            ]
            if valid_emails:
                details["email"] = valid_emails[0]
 
            # --- PORTFOLIO COMPANIES ---
            portfolio_section = soup.find(string=re.compile(r"portfolio", re.I))
            if portfolio_section:
                parent = portfolio_section.find_parent()
                if parent:
                    companies = []
                    for elem in parent.find_all(["a", "span", "div"]):
                        company_name = elem.get_text(strip=True)
                        if (
                            company_name
                            and len(company_name) > 2
                            and len(company_name) < 100
                        ):
                            companies.append(company_name)
                    details["portfolio_companies"] = companies[:20]  # Limit to first 20
            if not details["linkedin"]:
                print(f"  ⚠️ Skipping {investor_name}: No LinkedIn link found.")
                return None
            return details
 
        except Exception as e:
            print(f"  ❌ Error scraping {investor_name}: {str(e)}")
            return None
 
    def save_to_json(self, data, filename: str):
        """Save results to JSON"""
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n💾 Saved to {filename}")
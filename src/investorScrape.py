import json
import sys, os
from scraper.investor_scraper import CompanyInvestorScraper
from utils.investorExtractorUtils import (
    filter_conflicting_investors,
    getTopDomains,
    rank_investors_by_location_stage,
)
from constants.org_constants import TARGET_COMPANY_LOCATIONS, COMPANY, DESCRIPTION
 
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
 
def scrape_investors():
    company_name = COMPANY
    description = DESCRIPTION
 
    if not company_name or not description:
        # Send errors to stderr
        print(json.dumps({"error": "Both 'company' and 'description' are required"}), file=sys.stderr)
        sys.exit(1)
 
    scraper = CompanyInvestorScraper()
 
    # Get top domains based on description
    topDomains = getTopDomains(description)
 
    result = {"investors_by_domain": {}, "potential_investors": {}, "top_investors": []}
 
    # Process each domain
    for domain in topDomains:
        # ✅ Send debug output to stderr (won't interfere with JSON)
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Processing domain: {domain}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
 
        # 1. Get investors for this domain
        investors = scraper.scrape_domain_investors_full(
            domain, max_investors=10, delay=2
        )
        result["investors_by_domain"][domain] = investors
 
        result["potential_investors"] = filter_conflicting_investors(
            result["investors_by_domain"]
        )
        print(f"✅ Completed processing for {domain}", file=sys.stderr)
 
    result["top_investors"] = rank_investors_by_location_stage(
        TARGET_COMPANY_LOCATIONS, result["potential_investors"]["filtered_investors"]
    )
 
    # Save complete results
    scraper.save_to_json(
        result["top_investors"],
        f"src/investorData/complete_results_{company_name.replace(' ', '_')}.json",
    )

    return {"investors": result["top_investors"]}
 
if __name__ == "__main__":
    try:
        results = scrape_investors()
        print(json.dumps(results))
    except Exception as e:
        # Send errors to stderr
        error_output = {"error": str(e), "type": type(e).__name__}
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
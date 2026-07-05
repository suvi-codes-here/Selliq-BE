**SELLIQ = sales + IQ**

(Sales Intelligence powered by AI)

SELLIQ is an AI-powered sales intelligence platform that delivers real-time competitor insights, email intelligence, and investor discovery—so teams can sell smarter and faster.

**PROBLEM STATEMENT:**

1. Sales teams lack **real-time competitor visibility**
2. Important signals are buried in **email conversations**
3. Founders struggle with finding the **right investors**

**SELLIQ SOLUTION:**

1. Real-time **competitor intelligence** from LinkedIn and websites
2. **AI-driven email sentiment** & outreach insights
3. **Smart investor discovery** aligned with market and growth stage


**TECH STACK**

Backend

  - Node.js – Core API layer and orchestration
  - Python (Flask) – Web scraping, data extraction, and ML pipelines

AI / ML

  - OpenAI – Website change comparison & semantic diffing
  - RoBERTa – Email sentiment analysis

Data

  - PostgreSQL – Structured storage of competitors, investors, and insights
  - TypeORM – Database modeling and query management

Integrations

  - OpenVC – Competitor & investor sourcing
  - Harvest API – LinkedIn post tracking
  - Google APIs (OAuth) – Email access and analysis
  - Firecrawl – Website crawling and content extraction


**How It Works (System Architecture)**
**Competitor Discovery & Tracking**

  - Competitor and investor data is automatically scraped from OpenVC using a Flask-based service.
  - Data is normalized and stored in PostgreSQL for structured access.
  - TypeORM manages relationships and efficient querying across entities.

**Real-Time Competitor Insights**

  - LinkedIn posts are monitored via the Harvest API to track launches, pricing, and positioning.
  - Competitor websites are crawled continuously using Firecrawl.
  - OpenAI-powered document comparison detects meaningful content and strategy changes.

**Email Insights Engine**

  - Email threads are securely fetched through Google APIs using OAuth 2.0.
  - RoBERTa-based sentiment analysis processes conversation history.
  - The system surfaces churn risks, upsell opportunities, and outreach insights.

**Investor Intelligence**

  - Investor data is extracted from OpenVC and continuously updated.
  - Profiles are enriched with market relevance and portfolio alignment.
  - Founders can quickly identify and prioritize high-fit investors.


**WORKING DEMO:**

https://drive.google.com/file/d/18KQECnT1jAtjx_TXquSi6fSI5ZZ9AH_5/view?usp=sharing

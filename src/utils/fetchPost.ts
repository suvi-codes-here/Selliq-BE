// import { LinkedinScraper } from "@harvestapi/scraper";

dotenv.config();
export const fetchPost = async (competitorLinkedInUrl: string) => {
  try {
    const postsUrls = [];
    const params = new URLSearchParams({
      company: competitorLinkedInUrl,
      page: "1",
      postedLimit: "360hr",
    });

    const response = await fetch(
      `https://api.harvest-api.com/linkedin/company-posts?${params.toString()}`,
      {
        // headers: { "X-API-Key": "yI8rVdyxtlO2obOHRW9ml8Oety08pKw9" },
        headers: { "X-API-Key": process.env.HARVEST_API_KEY },      
      }
    );
    const data: any = await response.json();
    if (data && data.elements) {
      for (const ele of data.elements) {
        //   const scraper = new LinkedinScraper({
        //     apiKey: "jXPLthjkYnhl3kqKJyHeS7NSHlnvqus5",
        //   });

        // Replace this with the actual LinkedIn post URL
        const postUrl = ele.linkedinUrl;

        // Fetch details of a specific post
        // const postDetails = await scraper.getPost({ post: postUrl });
        // console.log(postDetails, "postDetails");

        // let content: string = "";
        // if (postDetails.element.repost?.content) {
        //   content = postDetails.element.repost?.content;
        // } else {
        //   postDetails.element.content;
        // }

        // console.log("linkedinUrl", postDetails.element.linkedinUrl);

        // console.log("content", content);
        postsUrls.push(postUrl);
      }
    }
    if (postsUrls.length > 0) return postsUrls.slice(0, 4);
    else return [];
  } catch (error) {
    console.error("❌ Error fetching post details:", error);
  }
};

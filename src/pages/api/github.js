import axios from "axios";
const GITHUB_API_URL = "https://api.github.com";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const response = await axios.get(
        `${GITHUB_API_URL}/repos/yeci226/YecisPlayground/commits`
      );

      const slicedData = response.data.slice(0, 7);

      const data = slicedData.map((commit) => ({
        sha: commit.sha.slice(0, 7),
        url: commit.html_url,
        message: commit.commit.message,
        date: commit.commit.author.date,
      }));

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

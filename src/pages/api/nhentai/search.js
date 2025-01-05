import { NHentai } from "@shineiichijo/nhentai-ts";
const nhentai = new NHentai({
  site: "nhentai.net",
  user_agent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  cookie_value:
    "cf_clearance=Xbc93mqhfDNhArZPwKCbDVfOAgsaKSgqmXRs4dKYn9w-1727342089-1.2.1.1-AckUCsP..xmCt41vioQwzDjNUuixx35MQuPc1sV8Veov7NpCp_NAi2z9bluSotpGfM.925ZwPRssRx7xuQNHxtGT5XGVFiM1IfGN8D9v.jomEfu0eq2uhuzx_nzX.UkXYNFj4IQ0xh.u3NYajOAjKfn1WIJnawxZZGtjU1kqsyyAzk3Pq52TyGQyXWFVrzbopeRgQqYR6tt00EROfDSZnwsq52YZg2vc2ilyr8w3PJIciyaHexoQauWBwbv7GG79k20LJKr73ouEYpZHWyyaxhr_Vj09v1PnJMk4i7QGwwRGeKyCYxWmYXJvVDYPPyyTOAgsnb1y6_8ps_cWIReO6G8AM_nyhlkkW7e27iKXAkD8ycnxiVkzvQhMhwL9AvHzNtDaW0.KiDwXsh6LQh16sg",
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      let manga;
      const { method, key, page } = req.query;
      switch (method) {
        case "random":
          manga = await nhentai.getRandom();
          break;
        case "id":
          manga = await nhentai.getDoujin(key);
          break;
        case "keyWord":
          manga = await nhentai.search(key, {
            page: page - 1,
          });
          break;
      }

      res.status(200).json(manga);
    } catch (error) {
      console.error("獲取失敗：", error);
      return [];
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

import axios from "axios";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { logUrl } = req.body;
    const warpResults = await getWarpLog(logUrl);
    res.status(200).json(warpResults);
  }
}

async function fetchWarpData(query, id, endId) {
  query.set("gacha_type", id);
  query.set("end_id", endId);

  return axios
    .get(
      "https://public-operation-hkrpg-sg.hoyoverse.com/common/gacha_record/api/getGachaLog?" +
        query
    )
    .then((response) => response.data);
}

async function getWarpLog(input) {
  const takumiQuery = new URLSearchParams({
    authkey_ver: 1,
    sign_type: 2,
    game_biz: "hkrpg_global",
    lang: "en",
    authkey: "",
    region: "",
    gacha_type: 0,
    size: 20,
    end_id: 0,
  });

  const queryParams = new URLSearchParams(input);
  const authkey = queryParams.get("authkey");
  let region = queryParams.get("region");
  const lastId = queryParams.get("end_id");
  const gachaTypes = { character: 11, light_cone: 12, regular: 1 };

  if (authkey) {
    const query = takumiQuery;
    query.set("authkey", authkey);
    const warps = [];

    for (const [gachaType, id] of Object.entries(gachaTypes)) {
      const result = await fetchWarpData(query, id, 0);

      if (result.retcode != 0)
        return { error: result.retcode, message: result.message };

      if (!region) region = result.region;
      query.set("region", region);

      let last_id = 0;
      const tempWarps = [];

      while (true) {
        const warpData = await fetchWarpData(query, id, last_id);

        if (warpData && warpData.data) {
          const listLength = warpData.data.list.length - 1;
          if (listLength < 0) break;

          for (const warp of warpData.data.list) {
            if (warp.id == lastId) break;
            tempWarps.push({
              id: warp.item_id,
              name: warp.name.toLowerCase().replaceAll(" ", "_"),
              type: warp.item_type.toLowerCase().replaceAll(" ", "_"),
              time: warp.time,
              rank: warp.rank_type,
            });
          }

          last_id = warpData.data.list[listLength].id;
          await sleep(550);
        } else break;
      }

      warps.push({
        type: gachaType,
        size: tempWarps.length,
        data: tempWarps,
      });
    }

    const list = {
      character: { total: 0, average: 0, pity: 0, data: [] },
      light_cone: { total: 0, average: 0, pity: 0, data: [] },
      regular: { total: 0, average: 0, pity: 0, data: [] },
    };

    for (const warp of warps) {
      const { type: warpType, data: warpData } = warp;
      let total = 0;
      let count = 0;

      const groupedRecords = [];
      let currentGroup = [];

      for (const index of warpData.reverse()) {
        total++;
        const recordEntry = {
          id: index.id,
          type: index.type,
          name: index.name,
          time: index.time,
          rank: index.rank,
          icon: `https://raw.githubusercontent.com/Mar-7th/StarRailRes/refs/heads/master/icon/${index.type}/${index.id}.png`,
          count: count + 1,
        };

        index.rank == 5 ? (count = 0) : count++;
        currentGroup.push(recordEntry);

        if (index.rank == 5)
          if (currentGroup.length > 0) {
            groupedRecords.push(currentGroup.reverse());
            currentGroup = [];
          }
      }

      if (currentGroup.length > 0) groupedRecords.push(currentGroup);

      groupedRecords[groupedRecords.length - 1].reverse(); // 讓墊池的順序正確
      list[warpType].data = groupedRecords;

      const { data } = list[warpType];
      data.reverse();
      list[warpType].pity = count;
      list[warpType].average = removeTrailingZeros(
        calculateAverageCount(data).toFixed(2)
      );
      list[warpType].total = total;
    }

    return list;
  }
}

const removeTrailingZeros = (num) =>
  num
    .toString()
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1");

const calculateAverageCount = (data) => {
  let total = 0;
  data.forEach((group, index) => {
    if (index == 0) return;
    total += group.length;
  });

  const average = total / (data.length - 1);

  return average;
};

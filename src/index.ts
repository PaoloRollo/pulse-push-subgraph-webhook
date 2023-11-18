import { CONSTANTS, PushAPI } from "@pushprotocol/restapi";
import { ethers } from "ethers";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { storeNFT } from "./nft";
import { pulseTokenABI } from "./pulse-token-abi";

const app = express();

let stream;

const main = async () => {
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY env variable is required.");
  }

  const provider = new ethers.providers.JsonRpcProvider(
    "https://goerli.base.org"
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const pushAPI = await PushAPI.initialize(wallet, {
    env: CONSTANTS.ENV.STAGING,
  });

  await pushAPI.notification.subscribe(
    process.env.CHANNEL_ADDRESS as string // channel address in CAIP format
  );

  stream = await pushAPI.initStream([CONSTANTS.STREAM.NOTIF], {
    filter: {
      channels: [process.env.CHANNEL_DELEGATE as string],
    },
    connection: {
      retries: 3, // number of retries in case of error
    },
  });

  // Listen for notifications events
  stream.on(CONSTANTS.STREAM.NOTIF, async (data: any) => {
    const { body } = data.message.notification;

    const [contentId, tokenId] = body.split(":");

    if (!contentId.includes("0x")) return;

    const uri = "";

    const supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_KEY as string
    );

    const { data: content } = await supabase
      .from("unified_posts")
      .select("*")
      .eq("content_id", contentId)
      .single();

    if (content) {
      const url = await storeNFT({
        username: content.author_name,
        preview: content.cleaned_text,
        platform: content.source,
        contentId: content.content_id,
      });
      const contract = new ethers.Contract(
        "0x8e85933d17b4b2c5b527782e3a982178536c51da",
        pulseTokenABI,
        wallet
      );

      await contract.functions.setURI(tokenId, url);
    }
  });

  // Connect stream, Important to setup up listen events first
  stream.connect();
};

main().then(() =>
  app.listen(9090, () => console.log(`push/subgraph webhook app started.`))
);

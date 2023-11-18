import { NFTStorage } from "nft.storage";
import * as fs from "fs";

interface DynamicSVGParameters {
  username: string;
  preview: string;
  platform: string;
  contentId: string;
}

const API_KEY: string = process.env.NFTSTORAGE_PRIVATE_KEY as string;

export async function storeNFT(params: DynamicSVGParameters): Promise<string> {
  const mdText = `# ${params.username} on ${params.platform}\n\n${params.preview}`;
  const file = fs.readFileSync("./src/nft.svg");

  const nft = {
    image: new File([file], `nft_${params.contentId}.svg`, {
      type: "image/svg",
    }),
    name: "Storing the Pulse NFT superlike content with NFT.Storage",
    description: "Pulse NFT representing a superlike content",
    properties: {
      type: "content-post",
      authors: [{ name: params.username }],
      content: {
        "text/markdown": mdText,
      },
    },
  };
  const client = new NFTStorage({ token: API_KEY });
  const metadata = await client.store(nft);

  return metadata.url;
}

// // Example usage
// const exampleParams: DynamicSVGParameters = {
//   username: "JohnDoe",
//   handle: "@john_doe",
//   preview: "This is a preview text.",
//   platform: "Twitter",
// };

// storeExampleNFT(exampleParams).then((res) => {
//
// });

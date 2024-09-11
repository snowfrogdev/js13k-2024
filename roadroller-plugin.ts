import { Packer } from "roadroller";
import { Plugin } from "vite";

export const roadrollerPlugin: Plugin = {
  name: "roadroller-compression",
  apply: "build",
  enforce: "post",
  generateBundle: async (options, bundle) => {
    for (const [fileName, asset] of Object.entries(bundle)) {
      if (fileName.endsWith(".js") && asset.type === "chunk") {
        try {
          console.log(`Compressing ${fileName} with Roadroller...`);
          const jsCode = asset.code;
          const packer = new Packer([{ data: jsCode, type: "js", action: "eval" }]);
          await packer.optimize(1);

          const { firstLine, secondLine } = packer.makeDecoder();
          asset.code = `${firstLine}${secondLine}`;

          console.log(`Compressed ${fileName} with Roadroller!`);
        } catch (error) {
          console.error(error);
        }
      }
    }
  },
};

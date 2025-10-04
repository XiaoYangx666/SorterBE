import fs from "fs";
import path from "path";

type Item = {
    v: number;
    ID: string;
    [key: string]: any;
};

interface BedrockData {
    enums: {
        block: Record<string, string>;
        item: Record<string, string>;
    };
}

/** 读取 bedrock 中的所有 id */
function getBedrockIds(inputFile: string): Set<string> {
    const raw = fs.readFileSync(path.resolve(inputFile), "utf-8");
    const data: BedrockData = JSON.parse(raw);
    const ids = new Set<string>();
    for (const key in data.enums.item) ids.add(key);
    for (const key in data.enums.block) ids.add(key);
    console.log(`从 ${inputFile} 中读取 ${ids.size} 个 id`);
    return ids;
}

/** 处理 data.json，根据 bedrockIds 判断是否存在，写入同一个文件 */
function filterIdsToSingleOutput(inputFile: string, bedrockFile: string, outputFile: string, version: number) {
    const raw = fs.readFileSync(path.resolve(inputFile), "utf-8");
    const data: Item[] = JSON.parse(raw);

    const bedrockIds = getBedrockIds(bedrockFile);

    const outputLines: string[] = [];

    for (const item of data) {
        if (item.v !== version || !item.ID) continue;
        const idPart = item.ID.split(".", 2)[1];
        if (!idPart) continue;

        if (bedrockIds.has(idPart)) {
            outputLines.push(`"${idPart}",`);
        } else {
            outputLines.push(`"${idPart}" [not found]`);
        }
    }

    fs.writeFileSync(path.resolve(outputFile), outputLines.join("\n"), "utf-8");
    console.log(`写入 ${outputLines.length} 个 id 到 ${outputFile}，未找到的加了标记`);
}

// 示例调用
filterIdsToSingleOutput("data.json", "vanilla.json", "output.txt", 12109);

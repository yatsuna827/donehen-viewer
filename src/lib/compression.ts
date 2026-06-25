const createUpstream = (value: unknown) =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(value);
      controller.close();
    },
  });

const textEncoder = new TextEncoder();
const compressToBase64 = async (input: string): Promise<string> => {
  const upstream = createUpstream(textEncoder.encode(input));
  const compression = new CompressionStream("deflate");
  const stream = upstream.pipeThrough(compression);
  const compressed = await new Response(stream).arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(compressed)));
};
export const compress = async (text: string): Promise<string> => {
  const withBase64 = await compressToBase64(text);
  return withBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const textDecoder = new TextDecoder();
const decompressFromBase64 = async (input: string): Promise<string> => {
  const compressedBytes = Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
  const upstream = createUpstream(compressedBytes);
  const decompression = new DecompressionStream("deflate");
  const stream = upstream.pipeThrough(decompression);
  const decompressed = await new Response(stream).arrayBuffer();
  return textDecoder.decode(decompressed);
};
export const decompress = async (encoded: string): Promise<string> => {
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decompressFromBase64(base64);
};

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  const testdata = `[["かたくらフジオ　が　ドネートで　でてきた"],"K","＄","____","","",["「よろしく」","","ドネート　ありがとう　ございました","※ このけっか　は　ランダム　です"]]`;

  test("compress snapshot", async () => {
    const compressed = await compress(testdata);
    expect(compressed).toMatchInlineSnapshot(
      `"eJxVjssJAkEQBVORPk8mhrAsm8q8GRF_i4g_PK0guOpBD14ExWCsAExBZsSD0PThdXd1FYWhMWrQlDAkLgk3wgnv0ST1OCTWxAdxgNqct2iPatRY6axrzt6PnjmrqqoyZ7kKw08IA0KN1onu6-_sj5hwgTBKz3RA_Zws0Ar10DPfNubs5e8dNEdnNEO7ZJ1WL9nxSLwSPXH7E9xYWX4AKDh_Dg"`,
    );
  });

  test("compress -> decompress roundtrip", async () => {
    const compressed = await compress(testdata);
    const decompressed = await decompress(compressed);
    expect(decompressed).toBe(testdata);
  });
}

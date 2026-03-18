import { describe, expect, it } from "vite-plus/test";
import { parseEip681 } from "./eip681";

describe("parseEip681", () => {
  it("parses a plain ethereum address", () => {
    expect(parseEip681("0x1111111111111111111111111111111111111111")).toEqual({
      address: "0x1111111111111111111111111111111111111111",
    });
  });

  it("parses a native transfer URI with chain id and value", () => {
    expect(
      parseEip681("ethereum:0x1111111111111111111111111111111111111111@8453?value=1230000000000"),
    ).toEqual({
      address: "0x1111111111111111111111111111111111111111",
      chainId: 8453,
      value: "1230000000000",
    });
  });

  it("parses an ERC-20 transfer URI", () => {
    expect(
      parseEip681(
        "ethereum:0x2222222222222222222222222222222222222222/transfer?address=0x1111111111111111111111111111111111111111&uint256=2500000",
      ),
    ).toEqual({
      address: "0x1111111111111111111111111111111111111111",
      token: "0x2222222222222222222222222222222222222222",
      amount: "2500000",
    });
  });

  it("ignores invalid chain identifiers", () => {
    expect(parseEip681("ethereum:0x1111111111111111111111111111111111111111@base?value=1")).toEqual(
      {
        address: "0x1111111111111111111111111111111111111111",
        value: "1",
      },
    );
  });

  it("returns null for invalid inputs", () => {
    expect(parseEip681("not-an-address")).toBeNull();
    expect(parseEip681("ethereum:0x2222222222222222222222222222222222222222/transfer")).toBeNull();
    expect(
      parseEip681("ethereum:0x2222222222222222222222222222222222222222/transfer?address=nope"),
    ).toBeNull();
  });
});

import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/register", "/rules", "/privacy"].map((path) => ({
    url: `${process.env.APP_URL || "http://localhost:3000"}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}

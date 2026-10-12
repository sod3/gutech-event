import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent:"*", allow:"/", disallow:["/admin","/dashboard","/judge","/api/","/invite/","/login"] }, ...(process.env.APP_URL ? { sitemap: `${process.env.APP_URL}/sitemap.xml` } : {}) }; }

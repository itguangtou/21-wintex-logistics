
import { MetadataRoute } from "next"; import { siteConfig } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap { const base = siteConfig.url.replace(/\/$/, ""); const routes=["","/about","/solutions","/products","/cases","/pricing","/news","/careers","/contact","/legal"]; const now=new Date().toISOString(); return routes.map(r=>({url:`${base}${r||"/"}`, lastModified:now}));}

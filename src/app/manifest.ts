import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "3N Homestay Booking Management",
    short_name: "3N Booking",
    description: "Pengelolaan booking homestay 3N",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff385c",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

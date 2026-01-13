"use client";

import { useEffect } from "react";

export default function PostPageMount() {
  useEffect(() => {
    document.body.classList.add("writoPostDetail");
    return () => {
      document.body.classList.remove("writoPostDetail");
      document.body.classList.remove("compactHeader");
    };
  }, []);

  return null;
}

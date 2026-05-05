import { useEffect, useState } from "react";

export default function HomePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      // your API call here
    }

    load();
  }, []);

  return <div>Home Page</div>;
}
'use client'
import Link from "next/link";
import store from "@/components/client/redux-manager/store/store";
import Consumer from "./routes/consumer/page";
import { Provider } from "react-redux";

export default function Home() {
  // throw new Error('A sample error')
  return (
      <>
          <Provider store={store}>
                <h1>Hello world</h1>
                <Link href='/random'>Link to random</Link>
                <Consumer/>
          </Provider>
      </>
  );
}

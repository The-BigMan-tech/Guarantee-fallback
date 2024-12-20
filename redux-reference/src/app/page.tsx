'use client'
import ReduxRef from "@/components/redux-ref";
import Body from "@/features/Body/body";
import { Provider } from "react-redux";
import store from "./store";

export default function Main() {
  return (
    <Provider store={store}>
        <ReduxRef/>
        <Body/>
    </Provider>
  )
}
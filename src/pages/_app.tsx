import "@/styles/globals.css";
import "@/styles/message.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/atom-one-dark.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { log } from "@/helper/logger";
import ErrorBoundary from "@/components/errorBoundary";

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {}, []);

    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, user-scalable=no"
                />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <ErrorBoundary>
                <Component {...pageProps} />
            </ErrorBoundary>
        </>
    );
}

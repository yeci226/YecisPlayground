import "../public/css/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Head from "next/head";
import favicon from "../public/assets/icon.png";

function MyApp({ Component, pageProps }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr auto",
        minHeight: "100vh",
      }}
    >
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>野茨遊樂場</title>
        <link rel="icon" href={favicon.src} />
        <meta property="og:title" content="野茨遊樂場" />
        <meta
          property="og:description"
          content="Yeci 開發過的專案及小工具都在這裡🤓"
        />
        <meta
          property="og:image"
          content="https://yecisplayground.vercel.app/assets/icon.png"
        />
        <meta property="og:url" content="https://yecisplayground.vercel.app" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}

export default MyApp;

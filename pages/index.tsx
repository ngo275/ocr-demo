import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {ChangeEvent, MouseEventHandler, useState} from "react";
import Webcam from "react-webcam";

export default function Home() {
  const [image, setImage] = useState<Blob | null>(null);
  const [createObjectURL, setCreateObjectURL] = useState<string | null>(null);
  const [showingCamera, setShowingCamera] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const showCamera = () => {
    setShowingCamera(true);
    setImage(null);
    setCreateObjectURL(null);
  }

  const uploadToClient = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const i = event.target.files[0];

      setImage(i);
      setCreateObjectURL(URL.createObjectURL(i));
    }
  };

  const uploadToServer: MouseEventHandler<HTMLButtonElement> = async (event) => {
    if (!image) return;
    const body = new FormData();
    body.append("file", image);
    const response = await fetch("/api/ocr", {
      method: "POST",
      body
    });
    const json = await response.json();
    setOcrResult(json.result)
  };

  const videoConstraints = {
    // facingMode: { exact: "environment" }
  };

  // ref: https://stackoverflow.com/a/16245768
  const b64toBlob = (b64Data: string, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>OCR Test</title>
        <meta name="description" content="OCR Testing App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>OCR Demo</h1>
        <button className="btn btn-primary" type="button" onClick={showCamera}>Start a camera</button>
        {showingCamera && (
          <Webcam
            audio={false}
            height={720}
            screenshotFormat="image/jpeg"
            width={1280}
            videoConstraints={videoConstraints}
          >
            {/* @ts-ignore */}
            {({ getScreenshot }) => (
              <button
                onClick={() => {
                  const imageSrc = getScreenshot()
                  const data = imageSrc?.split(",")[1] || "";
                  const blob = b64toBlob(data, "image/jpeg")
                  setShowingCamera(false);
                  setImage(blob)
                  setCreateObjectURL(URL.createObjectURL(blob));
                }}
              >
                Capture photo
              </button>
            )}
          </Webcam>
        )}
        {createObjectURL && (
          <Image src={createObjectURL} alt="selected image" height={720} width={960} />
        )}
        {/*<input type="file" name="myImage" onChange={uploadToClient} />*/}
        <button
          className="btn btn-primary"
          type="submit"
          onClick={uploadToServer}
        >
          Send to server
        </button>
        {ocrResult && (
          <div>
            <h2>OCR Result</h2>
            {ocrResult.split("\n").map((line) => (
              <p>{line}</p>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

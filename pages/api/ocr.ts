import type { NextApiRequest, NextApiResponse } from 'next'
// @ts-ignore
import { IncomingForm } from "formidable";
import fs from "fs";
import { ImageAnnotatorClient } from "@google-cloud/vision";

export const config = {
  api: {
    bodyParser: false,
  },
};

const post = async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new IncomingForm();
  try {
    form.parse(req, async function (err: any, fields: any, files: any) {
      if (err) {
        return res.status(400).send({ message: err });
      }

      const text = await handleFile(files.file[0]);
      return res.status(200).send({ result: text });
    });
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }
}

const handleFile = async (file: { filepath: string }) => {
  const client = new ImageAnnotatorClient();
  const content = await fs.readFileSync(file.filepath)
  const request = {
    image: {
      content: content.toString("base64"),
    },
    features: [
      {
        type: "TEXT_DETECTION"
      }
    ]
  }
  const [result] = await client.annotateImage(request)
  const labels = result.textAnnotations;
  let text = "";
  if (labels) {
    labels.forEach(label => {
      text += label.description;
    });
  }
  return text;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Not allowed" });
  }
  return post(req, res);
}

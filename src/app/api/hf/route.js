import { NextResponse } from "next/server";
import { inference } from "@/utils/hf";
import fs from "fs/promises";
import path from "path";
import { parse } from "url";

export async function POST(request) {
  const { query } = parse(request.url, true);
  const type = query.type;

  const formData = await request.formData();

  try {
    //chat completion
    if (type == "comp") {
      let message = formData.get("message");

      const out = await inference.chatCompletion({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 1000,
      });

      console.log(out.choices[0].message);

      return NextResponse.json(
        { message: out.choices[0].message },
        { status: 200 }
      );
    } //chat completion  ending

    //translation
    if (type == "translation") {
      const text = formData.get("text");

      const out = await inference.translation({
        model: "t5-base",
        inputs: text,
      });

      console.log(out);
      return NextResponse.json({ message: out }, { status: 200 });
    } //translation ending

    if (type == "imgtt") {
      const imageBlob = formData.get("image");

      if (!imageBlob) {
        throw new Error("No image file found in the request");
      }

      const out = await inference.imageToText({
        data: imageBlob,
        model: "nlpconnect/vit-gpt2-image-captioning",
      });

      console.log(out);

      return NextResponse.json({ message: out }, { status: 200 });
    }

    if (type == "ttimg") {
      const prompt = formData.get("prompt");
    
      const out = await inference.textToImage({
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        inputs: prompt,
        parameters: {
          negative_prompt: "blurry",
        },
      });

      console.log(out);

      const buffer = Buffer.from(await out.arrayBuffer());

      const imagePath = path.join(
        process.cwd(),
        "public",
        "images",
        "generated-image.jpg"
      );

      await fs.writeFile(imagePath, buffer);

      const baseUrl = "http://localhost:3001";
      const imageUrl = `${baseUrl}/images/generated-image.jpg`;

      return NextResponse.json({ message: imageUrl }, { status: 200 });


    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

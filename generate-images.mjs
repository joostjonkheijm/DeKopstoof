import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const API_KEY = "REDACTED";
const BASE_URL = "https://api.kie.ai/api/v1";

const images = [
  {
    id: "hero",
    prompt:
      "Charming Dutch bed and breakfast exterior in Lekkerkerk Netherlands, historic farmhouse building with warm terracotta brick, wooden shutters, cozy warm glowing windows, lush green garden with flowering plants, Dutch polder landscape with windmill in background, golden hour evening light, photorealistic, cinematic, extremely detailed, 8k quality",
    aspect_ratio: "16:9",
  },
  {
    id: "room-standard",
    prompt:
      "Cozy bed and breakfast bedroom interior, original exposed wooden ceiling beams, warm cream and earth tone linen bedding, queen bed with fluffy pillows, antique Dutch farmhouse furniture, soft warm morning light streaming through white-curtained windows, wooden floor, potted plant, photorealistic, interior photography",
    aspect_ratio: "4:3",
  },
  {
    id: "room-garden",
    prompt:
      "Dutch bed and breakfast garden view bedroom interior, large window overlooking lush green Dutch polder landscape and garden, wooden ceiling beams, elegant countryside furniture, fresh white linen bedding, natural morning light, serene peaceful atmosphere, photorealistic, high-end interior photography",
    aspect_ratio: "4:3",
  },
  {
    id: "room-deluxe",
    prompt:
      "Luxurious bed and breakfast deluxe suite interior, king size bed with premium linen and decorative pillows, separate elegant sitting area with vintage armchairs, exposed wooden beams, antique Dutch farmhouse style decor, warm amber lighting, luxury marble ensuite bathroom visible in background, photorealistic, luxury hotel photography",
    aspect_ratio: "4:3",
  },
  {
    id: "gallery-breakfast",
    prompt:
      "Beautiful Dutch B&B breakfast table setting, long rustic wooden farm table, fresh local artisan bread, local cheese platter, boiled eggs in cups, fresh flowers in glass vase, ceramic plates and cups, warm morning sunlight, farmhouse interior, photorealistic, food photography",
    aspect_ratio: "1:1",
  },
  {
    id: "gallery-garden",
    prompt:
      "Dutch bed and breakfast garden, lush green lawn, rustic wooden garden furniture and table, climbing roses on pergola, Dutch polder countryside in background, soft afternoon golden light, peaceful and serene, photorealistic",
    aspect_ratio: "1:1",
  },
  {
    id: "gallery-lounge",
    prompt:
      "Cozy Dutch B&B living room lounge, vintage farmhouse style, comfortable leather armchairs, stone fireplace, original wooden ceiling beams, bookshelves with books, warm amber lamp light, antique rugs, inviting and homely atmosphere, photorealistic",
    aspect_ratio: "1:1",
  },
  {
    id: "gallery-bathroom",
    prompt:
      "Luxury B&B bathroom, elegant freestanding white bathtub, natural stone floor tiles, wooden shelving with folded white towels, potted green plants, soft diffused lighting, spa-like serene atmosphere, photorealistic, interior photography",
    aspect_ratio: "1:1",
  },
  {
    id: "gallery-entrance",
    prompt:
      "Charming Dutch B&B front entrance, original wooden front door with ornate iron handle, terracotta flower pots with colorful blooms, ivy climbing brick walls, cobblestone path leading to door, warm golden evening light, photorealistic",
    aspect_ratio: "1:1",
  },
  {
    id: "gallery-detail",
    prompt:
      "Cozy Dutch B&B interior detail, breakfast tray with fresh coffee and pastries, window with white linen curtains, morning light, wooden windowsill with small plant, warm and inviting, photorealistic, still life photography",
    aspect_ratio: "1:1",
  },
  {
    id: "about-story",
    prompt:
      "Warm welcoming Dutch B&B owners couple in their cozy farmhouse kitchen, preparing a traditional Dutch breakfast together, natural authentic moment, warm morning light, farmhouse kitchen with wooden elements, genuine hospitality, photorealistic, lifestyle photography",
    aspect_ratio: "4:3",
  },
  {
    id: "surroundings",
    prompt:
      "Breathtaking Dutch polder landscape near Lekkerkerk South Holland, wide open flat green meadows with grazing cows, traditional windmills on horizon, mirror-like water channels, dramatic Dutch sky with clouds, golden late afternoon light, photorealistic, landscape photography",
    aspect_ratio: "16:9",
  },
  {
    id: "surroundings-water",
    prompt:
      "Dutch river IJssel near Lekkerkerk, sailboats on calm water, green riverbanks, quaint Dutch village with church spire in background, warm summer afternoon, photorealistic",
    aspect_ratio: "16:9",
  },
  {
    id: "hero-interior",
    prompt:
      "Interior of charming Dutch bed and breakfast, open plan living and dining area, original wooden beams, whitewashed walls, rustic antique furniture, fresh flowers in vases, warm candlelight and lamp light, cozy inviting atmosphere, photorealistic",
    aspect_ratio: "16:9",
  },
];

async function submitTask(image) {
  const response = await fetch(`${BASE_URL}/jobs/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nano-banana-2",
      input: {
        prompt: image.prompt,
        resolution: "2K",
        aspect_ratio: image.aspect_ratio,
        output_format: "jpg",
      },
    }),
  });
  const data = await response.json();
  console.log(`Submitted ${image.id}:`, JSON.stringify(data));
  return { id: image.id, taskId: data?.data?.taskId || data?.taskId };
}

async function pollTask(taskId, maxWait = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 5000));
    const response = await fetch(
      `${BASE_URL}/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );
    const data = await response.json();
    const state = data?.data?.state;
    console.log(`  Task ${taskId}: ${state}`);
    if (state === "success") {
      const result = JSON.parse(data.data.resultJson || "{}");
      return result.resultUrls?.[0] || result.url;
    }
    if (state === "fail") {
      console.error(`  Task ${taskId} failed`);
      return null;
    }
  }
  return null;
}

async function downloadImage(url, path) {
  const response = await fetch(url);
  const writer = createWriteStream(path);
  await pipeline(Readable.fromWeb(response.body), writer);
  console.log(`  Downloaded to ${path}`);
}

async function main() {
  console.log("Submitting image generation tasks...\n");
  const tasks = await Promise.all(images.map(submitTask));
  console.log("\nTasks submitted:", tasks);

  console.log("\nPolling for results...\n");
  for (const task of tasks) {
    if (!task.taskId) {
      console.error(`No taskId for ${task.id}, skipping`);
      continue;
    }
    console.log(`Waiting for ${task.id} (taskId: ${task.taskId})...`);
    const url = await pollTask(task.taskId);
    if (url) {
      await downloadImage(
        url,
        `/home/joost/Documenten/DeKopstoof/public/images/${task.id}.jpg`
      );
    } else {
      console.error(`Failed to get URL for ${task.id}`);
    }
  }
  console.log("\nAll done!");
}

main().catch(console.error);

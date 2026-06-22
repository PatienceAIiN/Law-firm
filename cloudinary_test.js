const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({ 
  cloud_name: 'dm4ndqjlg', 
  api_key: '165838688545264', 
  api_secret: 'h3080Su5BG6_y1rTkC5TsJwHQMc' 
});

async function run() {
  try {
    // 2. Upload an image
    console.log("Uploading sample image...");
    const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      public_id: 'cloudinary_onboarding_sample'
    });
    
    console.log("\nUpload Successful!");
    console.log("Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);

    // 3. Get image details
    console.log("\nImage Metadata:");
    console.log("Width:", uploadResult.width);
    console.log("Height:", uploadResult.height);
    console.log("Format:", uploadResult.format);
    console.log("File Size (bytes):", uploadResult.bytes);

    // 4. Transform the image
    // f_auto: Automatically selects the most efficient image format based on the requesting browser
    // q_auto: Automatically adjusts the image quality to reduce file size without visible degradation
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("Error during Cloudinary integration:", error);
  }
}

run();

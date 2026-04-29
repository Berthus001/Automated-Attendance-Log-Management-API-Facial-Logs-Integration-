# Image Processing Utility - Usage Examples

## Installation

The `sharp` package has been installed for image processing.

## Usage

### 1. Import the Utility

```javascript
const { processBase64Image, processMultipleBase64Images } = require('./utils/imageProcessor');
```

### 2. Process Single Base64 Image

```javascript
const base64String = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

const result = await processBase64Image(base64String, {
  maxWidth: 300,      // Max width in pixels
  quality: 70,        // JPEG quality (0-100)
  format: 'jpeg',     // Output format
  subfolder: 'faces', // Optional subfolder in uploads/
});

console.log(result);
// Output:
// {
//   success: true,
//   filePath: 'uploads/faces/img_1714694400000_a1b2c3d4.jpeg',
//   absolutePath: 'C:/Users/.../backend/uploads/faces/img_1714694400000_a1b2c3d4.jpeg',
//   filename: 'img_1714694400000_a1b2c3d4.jpeg',
//   size: 12345,
//   width: 300,
//   height: 225,
//   format: 'jpeg'
// }
```

### 3. Process Multiple Images

```javascript
const images = [
  'data:image/jpeg;base64,/9j/4AAQ...',
  'data:image/png;base64,iVBORw0KGgo...',
];

const results = await processMultipleBase64Images(images, {
  maxWidth: 300,
  quality: 70,
});

console.log(`Processed ${results.length} images`);
```

### 4. API Endpoints

#### Upload Single Image
```bash
POST /api/v1/upload/image
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "subfolder": "faces"
}
```

#### Upload Multiple Images
```bash
POST /api/v1/upload/images
Content-Type: application/json

{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQ...",
    "data:image/jpeg;base64,/9j/4AAQ..."
  ],
  "subfolder": "attendance"
}
```

#### Upload Face Image
```bash
POST /api/v1/upload/face
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "studentId": "STU001"
}
```

### 5. Response Format

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filePath": "uploads/faces/img_1714694400000_a1b2c3d4.jpeg",
    "filename": "img_1714694400000_a1b2c3d4.jpeg",
    "size": 12345,
    "width": 300,
    "height": 225,
    "format": "jpeg"
  }
}
```

## Features

✅ **Base64 to Image Conversion** - Handles data URIs and pure base64  
✅ **Auto Compression** - JPEG quality 70 with mozjpeg  
✅ **Smart Resize** - Max width 300px, maintains aspect ratio  
✅ **No Upscaling** - Small images won't be enlarged  
✅ **Progressive JPEG** - Better loading experience  
✅ **Unique Filenames** - Timestamp + random hash  
✅ **Subfolder Support** - Organize uploads by category  
✅ **Metadata Return** - Size, dimensions, format info  

## File Organization

```
/uploads
  ├── /faces           # Face images for recognition
  ├── /attendance      # Attendance log images
  └── [custom folders] # Any subfolder you specify
```

## Image Processing Details

- **Input**: Base64 string (with or without data URI prefix)
- **Output Format**: JPEG (optimized)
- **Max Width**: 300px
- **Quality**: 70%
- **Compression**: mozjpeg algorithm
- **Progressive**: Yes (loads gradually)
- **Aspect Ratio**: Preserved

## Error Handling

```javascript
try {
  const result = await processBase64Image(base64String);
  console.log('Success:', result.filePath);
} catch (error) {
  console.error('Failed:', error.message);
}
```

## Validation Helpers

```javascript
const { isValidBase64Image } = require('./utils/imageHelpers');

if (isValidBase64Image(base64String)) {
  // Process image
}
```

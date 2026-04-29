import fs from "fs";
export function clearUploadsFolder() {
    const folderPath = "src/uploads/";
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return;
        }
        // Loop through all files in the directory
        files.forEach((file) => {
            // Construct the file path
            const filePath = `${folderPath}${file}`;
            // Delete the file
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                    return;
                }
                console.log(`Deleted ${filePath}`);
            });
        });
    });
}

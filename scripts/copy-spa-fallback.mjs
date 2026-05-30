import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'

await copyFile(join(process.cwd(), 'dist', 'index.html'), join(process.cwd(), 'dist', '404.html'))

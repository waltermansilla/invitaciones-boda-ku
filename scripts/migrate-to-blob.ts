/**
 * Script para migrar imágenes de public/clientes a Vercel Blob
 * y actualizar los JSONs con las nuevas URLs
 * 
 * Ejecutar con: npx tsx scripts/migrate-to-blob.ts
 */

import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DATA_DIR = path.join(process.cwd(), 'data');

// Mapeo de rutas locales a URLs de blob
const urlMapping: Record<string, string> = {};

async function uploadFile(localPath: string): Promise<string> {
  const relativePath = localPath.replace(PUBLIC_DIR + '/', '');
  
  // Leer el archivo
  const fileBuffer = fs.readFileSync(localPath);
  const fileName = relativePath; // Mantener la estructura de carpetas
  
  console.log(`Subiendo: ${relativePath}`);
  
  // Subir a Vercel Blob
  const blob = await put(fileName, fileBuffer, {
    access: 'public',
  });
  
  console.log(`  -> ${blob.url}`);
  
  return blob.url;
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      // Solo archivos de imagen y audio
      const ext = path.extname(item).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.wav'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function updateJsonUrls(jsonPath: string) {
  let content = fs.readFileSync(jsonPath, 'utf-8');
  let updated = false;
  
  // Reemplazar todas las rutas locales con URLs de blob
  for (const [localPath, blobUrl] of Object.entries(urlMapping)) {
    // La ruta en el JSON puede ser "/clientes/..." o "clientes/..."
    const pathVariants = [
      `/${localPath}`,
      localPath,
      `"/${localPath}"`,
      `"${localPath}"`,
    ];
    
    for (const variant of pathVariants) {
      if (content.includes(variant)) {
        // Reemplazar manteniendo las comillas si las hay
        if (variant.startsWith('"') && variant.endsWith('"')) {
          content = content.split(variant).join(`"${blobUrl}"`);
        } else {
          content = content.split(variant).join(blobUrl);
        }
        updated = true;
      }
    }
  }
  
  if (updated) {
    fs.writeFileSync(jsonPath, content, 'utf-8');
    console.log(`Actualizado: ${jsonPath}`);
  }
}

async function main() {
  console.log('=== Migración a Vercel Blob ===\n');
  
  // 1. Buscar todos los archivos en public/clientes
  const clientesDir = path.join(PUBLIC_DIR, 'clientes');
  
  if (!fs.existsSync(clientesDir)) {
    console.log('No se encontró la carpeta public/clientes');
    return;
  }
  
  const files = await getAllFiles(clientesDir);
  console.log(`Encontrados ${files.length} archivos para migrar\n`);
  
  // 2. Subir cada archivo a Vercel Blob
  console.log('--- Subiendo archivos ---\n');
  
  for (const file of files) {
    try {
      const relativePath = file.replace(PUBLIC_DIR + '/', '');
      const blobUrl = await uploadFile(file);
      urlMapping[relativePath] = blobUrl;
    } catch (error) {
      console.error(`Error subiendo ${file}:`, error);
    }
  }
  
  // 3. Actualizar los JSONs
  console.log('\n--- Actualizando JSONs ---\n');
  
  const jsonFiles = [
    ...fs.readdirSync(path.join(DATA_DIR, 'clientes', 'boda')).map(f => path.join(DATA_DIR, 'clientes', 'boda', f)),
    ...fs.readdirSync(path.join(DATA_DIR, 'clientes', 'xv')).map(f => path.join(DATA_DIR, 'clientes', 'xv', f)),
  ].filter(f => f.endsWith('.json'));
  
  for (const jsonFile of jsonFiles) {
    updateJsonUrls(jsonFile);
  }
  
  // 4. Guardar el mapeo para referencia
  const mappingPath = path.join(process.cwd(), 'scripts', 'url-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(urlMapping, null, 2), 'utf-8');
  console.log(`\nMapeo guardado en: ${mappingPath}`);
  
  console.log('\n=== Migración completada ===');
  console.log(`\nPróximos pasos:`);
  console.log('1. Verificar que las invitaciones funcionen correctamente');
  console.log('2. Si todo está bien, eliminar la carpeta public/clientes');
}

main().catch(console.error);

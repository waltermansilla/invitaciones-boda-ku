/**
 * ============================================================
 * SCRIPT DE MIGRACION A VERCEL BLOB
 * ============================================================
 * 
 * Este script sube las imagenes de public/clientes a Vercel Blob
 * y actualiza automaticamente las URLs en los JSONs de invitaciones.
 * 
 * ES INCREMENTAL: solo sube archivos nuevos, no duplica los existentes.
 * 
 * ============================================================
 * COMO EJECUTAR
 * ============================================================
 * 
 * 1. Abri la terminal en la carpeta del proyecto
 * 2. Asegurate de tener el token de Blob configurado:
 *    export BLOB_READ_WRITE_TOKEN="tu_token_aqui"
 * 3. Ejecuta:
 *    npx tsx scripts/migrate-to-blob.ts
 * 
 * ============================================================
 * QUE HACE
 * ============================================================
 * 
 * 1. Busca todos los archivos en public/clientes/ (jpg, png, mp3, etc)
 * 2. Consulta Blob para ver cuales ya estan subidos
 * 3. Sube SOLO los archivos nuevos (no duplica)
 * 4. Actualiza los JSONs con las nuevas URLs de Blob
 * 5. Guarda un mapeo de URLs en scripts/url-mapping.json
 * 
 * ============================================================
 * DESPUES DE EJECUTAR
 * ============================================================
 * 
 * 1. Verifica que las invitaciones funcionen en localhost
 * 2. Hace commit y push de los JSONs actualizados
 * 3. (Opcional) Borra los archivos migrados de public/clientes/
 * 
 */

import { put, list } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const DATA_DIR = path.join(process.cwd(), 'data');

// Mapeo de rutas locales a URLs de blob
const urlMapping: Record<string, string> = {};

// Obtener todos los archivos ya subidos a Blob
async function getExistingBlobFiles(): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  let cursor: string | undefined;
  
  console.log('Consultando archivos existentes en Blob...');
  
  do {
    const result = await list({ cursor, limit: 1000 });
    for (const blob of result.blobs) {
      existing.set(blob.pathname, blob.url);
    }
    cursor = result.cursor;
  } while (cursor);
  
  return existing;
}

async function uploadFile(localPath: string): Promise<string> {
  const relativePath = localPath.replace(PUBLIC_DIR + '/', '');
  const fileBuffer = fs.readFileSync(localPath);
  
  console.log(`  Subiendo: ${relativePath}`);
  
  const blob = await put(relativePath, fileBuffer, {
    access: 'public',
  });
  
  console.log(`    -> ${blob.url}`);
  
  return blob.url;
}

async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else {
      const ext = path.extname(item).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.wav', '.mp4'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function updateJsonUrls(jsonPath: string) {
  let content = fs.readFileSync(jsonPath, 'utf-8');
  let updated = false;
  
  for (const [localPath, blobUrl] of Object.entries(urlMapping)) {
    const pathVariants = [
      `"/${localPath}"`,
      `"${localPath}"`,
      `/${localPath}`,
      localPath,
    ];
    
    for (const variant of pathVariants) {
      if (content.includes(variant)) {
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
    console.log(`  Actualizado: ${path.basename(jsonPath)}`);
  }
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('   MIGRACION A VERCEL BLOB');
  console.log('========================================');
  console.log('');
  
  // 1. Obtener archivos existentes en Blob
  const existingBlobs = await getExistingBlobFiles();
  console.log(`Ya existen ${existingBlobs.size} archivos en Blob`);
  console.log('');
  
  // 2. Buscar archivos locales
  const clientesDir = path.join(PUBLIC_DIR, 'clientes');
  
  if (!fs.existsSync(clientesDir)) {
    console.log('No se encontro la carpeta public/clientes');
    console.log('No hay nada que migrar.');
    return;
  }
  
  const files = await getAllFiles(clientesDir);
  console.log(`Encontrados ${files.length} archivos locales`);
  console.log('');
  
  // 3. Subir solo los nuevos
  console.log('--- SUBIENDO ARCHIVOS NUEVOS ---');
  console.log('');
  
  let uploaded = 0;
  let skipped = 0;
  const filesToDelete: string[] = [];
  
  for (const file of files) {
    const relativePath = file.replace(PUBLIC_DIR + '/', '');
    
    // Si ya existe en Blob, usar la URL existente
    if (existingBlobs.has(relativePath)) {
      urlMapping[relativePath] = existingBlobs.get(relativePath)!;
      filesToDelete.push(file);
      skipped++;
      continue;
    }
    
    // Subir archivo nuevo
    try {
      const blobUrl = await uploadFile(file);
      urlMapping[relativePath] = blobUrl;
      filesToDelete.push(file);
      uploaded++;
    } catch (error) {
      console.error(`  Error subiendo ${relativePath}:`, error);
    }
  }
  
  console.log('');
  console.log(`Subidos: ${uploaded} nuevos`);
  console.log(`Saltados: ${skipped} (ya existian)`);
  console.log('');
  
  // 4. Actualizar JSONs
  console.log('--- ACTUALIZANDO JSONs ---');
  console.log('');
  
  const bodaDir = path.join(DATA_DIR, 'clientes', 'boda');
  const xvDir = path.join(DATA_DIR, 'clientes', 'xv');
  
  const jsonFiles: string[] = [];
  
  if (fs.existsSync(bodaDir)) {
    jsonFiles.push(...fs.readdirSync(bodaDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(bodaDir, f)));
  }
  
  if (fs.existsSync(xvDir)) {
    jsonFiles.push(...fs.readdirSync(xvDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(xvDir, f)));
  }
  
  for (const jsonFile of jsonFiles) {
    updateJsonUrls(jsonFile);
  }
  
  // 5. Guardar mapeo
  const mappingPath = path.join(process.cwd(), 'scripts', 'url-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(urlMapping, null, 2), 'utf-8');
  
  console.log('');
  console.log('========================================');
  console.log('   MIGRACION COMPLETADA');
  console.log('========================================');
  console.log('');
  console.log('Proximos pasos:');
  console.log('1. Verifica que las invitaciones funcionen en localhost');
  console.log('2. Hace commit y push:');
  console.log('   git add .');
  console.log('   git commit -m "Migrar imagenes a Blob"');
  console.log('   git push');
  console.log('');
  
  if (filesToDelete.length > 0) {
    console.log('========================================');
    console.log('   ARCHIVOS QUE PODES BORRAR');
    console.log('========================================');
    console.log('');
    console.log(`Total: ${filesToDelete.length} archivos ya estan en Blob`);
    console.log('');
    
    for (const file of filesToDelete) {
      console.log(`   ${file.replace(process.cwd() + '/', '')}`);
    }
    
    console.log('');
    console.log('Para borrarlos automaticamente, ejecuta:');
    console.log('   npx tsx scripts/migrate-to-blob.ts --delete');
    console.log('');
  }
}

// Funcion para borrar archivos migrados
async function deleteFiles(files: string[]) {
  console.log('');
  console.log('========================================');
  console.log('   BORRANDO ARCHIVOS MIGRADOS');
  console.log('========================================');
  console.log('');
  
  let deleted = 0;
  for (const file of files) {
    try {
      fs.unlinkSync(file);
      console.log(`   Borrado: ${file.replace(process.cwd() + '/', '')}`);
      deleted++;
    } catch (error) {
      console.error(`   Error borrando ${file}:`, error);
    }
  }
  
  // Limpiar carpetas vacias
  cleanEmptyDirs(path.join(PUBLIC_DIR, 'clientes'));
  
  console.log('');
  console.log(`Borrados: ${deleted} archivos`);
  console.log('');
}

// Funcion para limpiar carpetas vacias
function cleanEmptyDirs(dir: string) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanEmptyDirs(fullPath);
    }
  }
  
  // Si la carpeta quedo vacia, borrarla
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0) {
    fs.rmdirSync(dir);
    console.log(`   Carpeta vacia borrada: ${dir.replace(process.cwd() + '/', '')}`);
  }
}

// Ejecutar
const shouldDelete = process.argv.includes('--delete');

if (shouldDelete) {
  // Primero obtener la lista de archivos a borrar
  (async () => {
    const existingBlobs = await getExistingBlobFiles();
    const clientesDir = path.join(PUBLIC_DIR, 'clientes');
    
    if (!fs.existsSync(clientesDir)) {
      console.log('No hay archivos locales para borrar.');
      return;
    }
    
    const files = await getAllFiles(clientesDir);
    const filesToDelete: string[] = [];
    
    for (const file of files) {
      const relativePath = file.replace(PUBLIC_DIR + '/', '');
      if (existingBlobs.has(relativePath)) {
        filesToDelete.push(file);
      }
    }
    
    if (filesToDelete.length === 0) {
      console.log('No hay archivos para borrar (ninguno esta en Blob).');
      return;
    }
    
    await deleteFiles(filesToDelete);
  })().catch(console.error);
} else {
  main().catch(console.error);
}

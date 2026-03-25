import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Mapeo de rutas locales a URLs de blob
const urlMapping: Record<string, string> = {};

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
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.wav'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

export async function POST() {
  const logs: string[] = [];
  
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const dataDir = path.join(process.cwd(), 'data');
    const clientesDir = path.join(publicDir, 'clientes');
    
    if (!fs.existsSync(clientesDir)) {
      return NextResponse.json({ error: 'No se encontró public/clientes' }, { status: 404 });
    }
    
    // 1. Obtener todos los archivos
    const files = await getAllFiles(clientesDir);
    logs.push(`Encontrados ${files.length} archivos`);
    
    // 2. Subir cada archivo
    for (const file of files) {
      const relativePath = file.replace(publicDir + '/', '');
      const fileBuffer = fs.readFileSync(file);
      
      logs.push(`Subiendo: ${relativePath}`);
      
      const blob = await put(relativePath, fileBuffer, {
        access: 'public',
      });
      
      urlMapping[relativePath] = blob.url;
      logs.push(`  -> ${blob.url}`);
    }
    
    // 3. Actualizar JSONs
    const bodaDir = path.join(dataDir, 'clientes', 'boda');
    const xvDir = path.join(dataDir, 'clientes', 'xv');
    
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
      let content = fs.readFileSync(jsonFile, 'utf-8');
      let updated = false;
      
      for (const [localPath, blobUrl] of Object.entries(urlMapping)) {
        const searchPath = `/${localPath}`;
        if (content.includes(searchPath)) {
          content = content.split(searchPath).join(blobUrl);
          updated = true;
        }
      }
      
      if (updated) {
        fs.writeFileSync(jsonFile, content, 'utf-8');
        logs.push(`Actualizado: ${path.basename(jsonFile)}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      filesUploaded: files.length,
      urlMapping,
      logs 
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: String(error), 
      logs 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Usa POST para ejecutar la migración',
    warning: 'Esto subirá todas las imágenes de public/clientes a Vercel Blob y actualizará los JSONs'
  });
}

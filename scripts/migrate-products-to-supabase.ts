import { createClient } from '@supabase/supabase-js'
import { products } from '../src/data/catalog'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateProducts() {
  console.log('Starting migration of products to Supabase...')

  for (const product of products) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          title: product.title,
          category: product.category,
          collection: product.collection,
          price: product.price,
          image: product.image,
          specs: product.specs,
          summary: product.summary,
          source_url: product.sourceUrl,
          available: true
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error(`Error inserting product ${product.id}:`, error)
      } else {
        console.log(`✓ Migrated: ${product.title}`)
      }
    } catch (error) {
      console.error(`Error processing product ${product.id}:`, error)
    }
  }

  console.log('Migration complete!')
}

migrateProducts()

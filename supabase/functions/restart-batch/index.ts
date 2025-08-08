import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { batchId } = await req.json()

    console.log('Restarting batch:', batchId)

    // Reset batch status to pending
    const { error: batchError } = await supabase
      .from('import_batches')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)

    if (batchError) {
      console.error('Error updating batch:', batchError)
      return new Response(JSON.stringify({ error: batchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Call the batch processor
    const { error: processorError } = await supabase.functions.invoke('batch-processor', {
      body: { batchId }
    })

    if (processorError) {
      console.error('Error calling batch processor:', processorError)
      return new Response(JSON.stringify({ error: processorError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Batch processing restarted successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in restart-batch function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
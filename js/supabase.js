import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl =
    "https://ffkdxdfbrahvdaycexsa.supabase.co";

const supabaseKey =
    "sb_publishable_vRuP-_CBlOpxyxmzUjOnVQ_XNHBSTHp";

export const supabase = createClient(
    supabaseUrl,
    supabaseKey
);
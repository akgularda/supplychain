# Plan: Complete HQ Metadata and Finalize

## Goal
Complete the dataset by adding missing HQ Cities for companies ranked 21-100 and finalize the output.

## Steps
1.  **Identify Missing Cities:** Scan `data/top100-map-updated.json` for empty `hq.city` fields.
2.  **Batch Research:**
    *   Perform search for HQ cities of companies ranked 21-60.
    *   Perform search for HQ cities of companies ranked 61-100.
3.  **Update Dataset:**
    *   Create a mapping of Symbol -> City.
    *   Apply updates to `data/top100-map-updated.json`.
    *   Update `change_log` to reflect these additions.
4.  **Final Quality Check:**
    *   Verify all 100 companies have full HQ metadata (City, Country, Flag, Logo).
    *   Ensure strict sourcing adherence (existing profiles are source-backed, but verify no fields are broken).
5.  **Final Output:** Present the final JSON content.

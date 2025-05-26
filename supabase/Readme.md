# supabase/

This folder contains all database-related resources for the Sniffr project.

## Structure

- **migrations/**  
  Contains SQL migration scripts for setting up and evolving the project’s PostgreSQL schema. Each file represents a step in the schema’s evolution, applied in order using the Supabase CLI.

- *(future)*  
  You can place seed scripts, configuration files, or other Supabase/Postgres resources here as needed.

## How to use

- To apply migrations:  
  Run `supabase db push` from the project root or from within the `supabase/` directory.

- To add a new migration:  
  Place a properly-named `.sql` file in `migrations/` following the timestamped naming convention.

- To keep this folder visible in GitHub, this README is included.  
  *(If you delete this and do not add other files, GitHub may hide the folder.)*

---

**Maintainers:**  
If you’re working on database-related code or migrations, start here!

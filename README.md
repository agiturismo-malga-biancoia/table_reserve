# Table Reserve - Restaurant Reservation System

A modern, responsive web application for managing restaurant table reservations. This system allows restaurant staff to create, view, edit, and delete table reservations through an intuitive calendar interface.

## Features

- Interactive calendar view with monthly, weekly, and daily views
- Create new reservations with customer details, party size, and date/time
- View, edit, and delete existing reservations
- Real-time updates when reservations are modified
- Toast notifications for successful operations
- Responsive design for all device sizes

## Tech Stack

- React 18 for UI components
- Tailwind CSS for styling
- FullCalendar for the calendar interface
- Supabase for database and real-time functionality
- TypeScript for type safety
- Vite for fast development and building

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run the database migration in your Supabase project:
   - Navigate to the SQL Editor in your Supabase dashboard
   - Run the SQL from `supabase/migrations/create_reservations_table.sql`

5. Start the development server:
   ```
   npm run dev
   ```

## Data Model

The application uses a single `reservations` table with the following structure:

- `id`: UUID (primary key, auto-generated)
- `userName`: String (required) - name of the user creating the reservation
- `customerName`: String (required) - name of the customer
- `contactInfo`: String (optional) - phone or email
- `numberOfPeople`: Integer (required) - number of people for the reservation
- `reservationDate`: DateTime (required) - date and time of the reservation
- `notes`: Text (optional) - special requests or additional information
- `createdAt`: Timestamp (auto-generated)
- `updatedAt`: Timestamp (auto-updated)

## License

MIT
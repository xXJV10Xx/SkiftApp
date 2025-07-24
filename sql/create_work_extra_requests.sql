-- Create work_extra_requests table
CREATE TABLE IF NOT EXISTS work_extra_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position TEXT NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  hourly_rate TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'interested', 'filled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE work_extra_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view work extra requests in their company" ON work_extra_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e1, employees e2 
      WHERE e1.id = auth.uid() 
      AND e2.id = work_extra_requests.requester_id 
      AND e1.company_id = e2.company_id
    )
  );

CREATE POLICY "Users can create their own work extra requests" ON work_extra_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update work extra requests in their company" ON work_extra_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e1, employees e2 
      WHERE e1.id = auth.uid() 
      AND e2.id = work_extra_requests.requester_id 
      AND e1.company_id = e2.company_id
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_work_extra_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_extra_requests_updated_at
  BEFORE UPDATE ON work_extra_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_work_extra_requests_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_work_extra_requests_requester_id ON work_extra_requests(requester_id);
CREATE INDEX idx_work_extra_requests_status ON work_extra_requests(status);
CREATE INDEX idx_work_extra_requests_date ON work_extra_requests(date);
CREATE INDEX idx_work_extra_requests_created_at ON work_extra_requests(created_at DESC);
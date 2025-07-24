-- Create shift_change_requests table
CREATE TABLE IF NOT EXISTS shift_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_shift_date DATE NOT NULL,
  current_shift_time TIME NOT NULL,
  requested_shift_date DATE NOT NULL,
  requested_shift_time TIME NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  target_employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shift_change_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view shift change requests in their company" ON shift_change_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e1, employees e2 
      WHERE e1.id = auth.uid() 
      AND e2.id = shift_change_requests.requester_id 
      AND e1.company_id = e2.company_id
    )
  );

CREATE POLICY "Users can create their own shift change requests" ON shift_change_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update shift change requests in their company" ON shift_change_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e1, employees e2 
      WHERE e1.id = auth.uid() 
      AND e2.id = shift_change_requests.requester_id 
      AND e1.company_id = e2.company_id
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_shift_change_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shift_change_requests_updated_at
  BEFORE UPDATE ON shift_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_change_requests_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_shift_change_requests_requester_id ON shift_change_requests(requester_id);
CREATE INDEX idx_shift_change_requests_status ON shift_change_requests(status);
CREATE INDEX idx_shift_change_requests_created_at ON shift_change_requests(created_at DESC);
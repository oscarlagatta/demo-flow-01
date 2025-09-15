import { useMutation } from '@tanstack/react-query';

import { postApiV2SplunkDataRaiseIncidentMutation } from '@bofa/data-services';


export function useIncidents() {
  const createIncidentMutation = useMutation(
    postApiV2SplunkDataRaiseIncidentMutation()
  );

  const createIncident = async (data : {
    subject: string;
    severity: string;
    umid: number;
    description: string;
  }) {
  
    try {
    
      await createIncidentMutation.mutateAsync({
        body: data
      });        
    } catch (error) {
    
      console.error('Failed to add incident', error);
      throw error;
    }
  }

  return {
    createIncident
  }
}

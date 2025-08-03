const fetchTranscripts = async () => {
    try {
      const url = limit ? `/api/transcripts?limit=${limit}` : '/api/transcripts';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcripts');
      }
      
      const data = await response.json();
      // Handle both array response (for compatibility) and object response
      setTranscripts(Array.isArray(data) ? data : data.transcripts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
import { EXTRACTORW_API_URL } from './api';

export async function extractCapturados(
  codexItemId: string,
  projectId: string,
  accessToken: string
): Promise<{ success: boolean; count: number; cards: any[] }> {
  const response = await fetch(`${EXTRACTORW_API_URL}/capturados/from-codex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ codex_item_id: codexItemId, project_id: projectId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  return response.json();
}

export async function bulkExtractCapturados(
  projectId: string,
  accessToken: string,
  codexItemIds?: string[]
): Promise<{ processed_count: number; total_cards: number }> {
  const res = await fetch(`${EXTRACTORW_API_URL}/capturados/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ 
      project_id: projectId,
      codex_item_ids: codexItemIds 
    })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteCapturadoCard(
  cardId: string,
  accessToken: string
): Promise<{ success: boolean; message: string; deleted_id: string }> {
  const response = await fetch(`${EXTRACTORW_API_URL}/capturados/${cardId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  return response.json();
}

export async function deleteAllCapturadoCards(projectId: string, accessToken: string) {
  const res = await fetch(`${EXTRACTORW_API_URL}/capturados/project/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface CapturadoUpdatePayload {
  entity?: string;
  city?: string;
  department?: string;
  description?: string;
  discovery?: string;
}

export async function updateCapturadoCard(
  cardId: string,
  updates: CapturadoUpdatePayload,
  accessToken: string
): Promise<{ success: boolean; card: any }> {
  const response = await fetch(`${EXTRACTORW_API_URL}/capturados/${cardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error ${response.status}`);
  }

  return response.json();
} 
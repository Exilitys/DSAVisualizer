import {createTutorHandler} from '../../../server/tutor.ts';
import {createOllamaProvider} from '../../../server/ollama.ts';

export const runtime='nodejs';
export const POST=createTutorHandler({provider:createOllamaProvider({
  baseUrl:process.env.OLLAMA_BASE_URL??'http://127.0.0.1:11434',model:process.env.OLLAMA_MODEL??'',
})});

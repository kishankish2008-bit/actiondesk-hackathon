import { GeneralInfoConstraints, GeneralInfoResult } from '../../../shared/types.js';

/** Deliberately returns no answer until a real, approved search source is configured. */
export class InfoAdapter {
  async query(constraints: GeneralInfoConstraints): Promise<GeneralInfoResult> {
    return {
      query: constraints.query,
      answer:
        'ActionDesk has no live, approved information search source configured, so it could not verify this request. No answer or citations have been invented. Use the search handoff below to continue on the web.',
      sources: [],
      unverifiedClaims: [`No approved live source was queried for: ${constraints.query}`],
      isSimulatedKnowledgebase: false,
    };
  }
}

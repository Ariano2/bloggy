import sys
import spacy
import pytextrank
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import math

def summarize(text, word_limit=50, buffer=10):
    """Summarize text using advanced TextRank with enhanced positional weighting, semantic redundancy reduction, and context-aware selection."""
    try:
        # Load spaCy model
        nlp = spacy.load("en_core_web_sm")
        if "textrank" not in nlp.pipe_names:
            nlp.add_pipe("textrank")

        # Process text
        doc = nlp(text)
        sentences = [sent for sent in doc.sents if len(sent.text.strip().split()) > 5]
        if not sentences:
            return "Error: No valid sentences found."

        # Get total word count for dynamic adjustments
        total_words = sum(len(sent.text.split()) for sent in sentences)

        # Get TextRank scores
        tr_scores = []
        for sent in sentences:
            score = 0
            for phrase in doc._.textrank.phrases:
                if any(token in sent for token in phrase.text.split()):
                    score += phrase.rank
            tr_scores.append(score / max(1, len(sent.text.split())))  # Normalize by length

        # Advanced positional weighting: Sigmoid for early sentences, boost for final sentences
        def sigmoid(x, steepness=5, shift=0):
            return 1 / (1 + math.exp(-steepness * (x - shift)))
        
        positional_weights = []
        for i in range(len(sentences)):
            pos = i / max(1, len(sentences) - 1)
            weight = 1.0 + 0.5 * sigmoid(pos, steepness=10, shift=0.1)  # Early boost
            if i >= len(sentences) * 0.8 and total_words > 300:  # Final boost for long texts
                weight += 0.3
            positional_weights.append(weight)
        
        weighted_scores = [tr * pw for tr, pw in zip(tr_scores, positional_weights)]

        # TF-IDF for redundancy reduction and context
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform([sent.text for sent in sentences])
        # Convert to array for mean calculation
        tfidf_centroid = np.asarray(tfidf_matrix.mean(axis=0))  # Blog's "central" topic

        # Semantic similarity using spaCy embeddings
        sent_vectors = [sent.vector / (np.linalg.norm(sent.vector) or 1) for sent in sentences]
        semantic_similarity = cosine_similarity(sent_vectors)

        # Dynamic similarity threshold: Stricter for short texts, looser for long
        similarity_threshold = 0.6 if total_words < 300 else 0.75

        # Context-aware sentence selection: Maximize score within word_limit
        candidates = []
        for idx in np.argsort(weighted_scores)[::-1]:
            # Compute context score: Similarity to TF-IDF centroid
            sent_tfidf = tfidf_matrix[idx].toarray()  # Convert to array
            context_score = cosine_similarity(sent_tfidf, tfidf_centroid)[0][0]
            candidates.append({
                'idx': idx,
                'score': weighted_scores[idx] + 0.2 * context_score,  # Blend with context
                'wc': len(sentences[idx].text.split()),
                'text': sentences[idx].text.strip()
            })

        # Knapsack-like selection
        selected_indices = []
        word_count = 0
        dynamic_buffer = 5 if word_limit == 50 else 15  # Smaller buffer for 50 words
        for cand in sorted(candidates, key=lambda x: x['score'] / (x['wc'] or 1), reverse=True):  # Prefer concise sentences
            idx = cand['idx']
            wc = cand['wc']
            if word_count + wc > word_limit + dynamic_buffer:
                continue
            # Check redundancy (TF-IDF + semantic)
            if not selected_indices or all(
                max(
                    cosine_similarity(tfidf_matrix[idx].toarray(), tfidf_matrix[sel].toarray())[0][0],
                    semantic_similarity[idx][sel]
                ) < similarity_threshold
                for sel in selected_indices
            ):
                selected_indices.append(idx)
                word_count += wc

        # Build summary
        summary_sentences = [sentences[idx].text.strip() for idx in selected_indices]
        summary = ' '.join(summary_sentences)
        return summary if summary else sentences[0].text.strip()[:word_limit]
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    input_text = sys.stdin.read().strip()
    word_limit = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 50
    result = summarize(input_text, word_limit=word_limit)
    print(result)
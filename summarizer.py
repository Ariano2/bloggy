import sys
import spacy
import pytextrank

def summarize(text, word_limit=50, buffer=10):
    nlp = spacy.load("en_core_web_sm")
    if "textrank" not in nlp.pipe_names:
        nlp.add_pipe("textrank")

    doc = nlp(text)

    sentences = []
    word_count = 0

    for sent in doc._.textrank.summary(limit_phrases=20, limit_sentences=10):
        wc = len(sent.text.split())
        if word_count >= word_limit and word_count + wc > word_limit + buffer:
            break  # stop if adding this would push far beyond the upper buffer
        sentences.append(sent.text.strip())
        word_count += wc

    return ' '.join(sentences)

if __name__ == "__main__":
    input_text = sys.stdin.read()
    input_text = input_text.strip()
    result = summarize(input_text)
    print(result)

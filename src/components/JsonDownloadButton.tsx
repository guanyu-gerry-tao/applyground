interface JsonDownloadButtonProps {
  data: unknown;
  filename: string;
  label?: string;
}

export default function JsonDownloadButton({
  data,
  filename,
  label = 'Download submission.json',
}: JsonDownloadButtonProps) {
  const handleClick = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" data-action="download-submission" onClick={handleClick}>
      {label}
    </button>
  );
}

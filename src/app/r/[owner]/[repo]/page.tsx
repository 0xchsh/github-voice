import { fetchRepoData } from "@/lib/github"
import { RepoShowClient } from "./repo-show-client"

interface Props {
  params: Promise<{ owner: string; repo: string }>
}

export default async function RepoShowPage({ params }: Props) {
  const { owner, repo } = await params
  const repoData = await fetchRepoData(owner, repo)
  return <RepoShowClient repoData={repoData} />
}

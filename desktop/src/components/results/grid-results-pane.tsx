import { gridParamsAtom } from "@/Atoms";
import { TParamIteration } from "@/Interfaces";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { useQueries } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { get_inference } from "../queries";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import IterationResult from "./iteration-result";

const now = new Date();
const start = now.toUTCString();

export default function GridResultsPane() {
  const [gridParams, _] = useAtom(gridParamsAtom);
  const [iterations, setIterations] = useState<TParamIteration[]>([]);
  const [noCompleted, setNoCompleted] = useState(0);
  const [expandParams, setExpandParams] = useState(false);
  const [expandMetadata, setExpandMetadata] = useState(false);
  // const queryClient = useQueryClient();

  //https://stackoverflow.com/questions/76933229/can-react-query-make-sequential-network-calls-and-wait-for-previous-one-to-finis

  // creates a linear array with param combinations
  useEffect(() => {
    setNoCompleted(0);
    const localIterations = [];
    for (const model of gridParams.models) {
      for (const temperature of gridParams.temperatureList) {
        for (const repeat_penalty of gridParams.repeatPenaltyList) {
          for (const top_k of gridParams.topKList) {
            for (const top_p of gridParams.topPList) {
              localIterations.push({
                model,
                prompt: gridParams.prompt,
                temperature,
                repeat_penalty,
                top_k,
                top_p,
              });
            }
          }
        }
      }
    }
    setIterations(localIterations);
  }, [gridParams.uuid]);

  // // Define type for query options
  // type ModelQueryOptions = UseQueryOptions<
  //   unknown,
  //   Error,
  //   unknown,
  //   string[] | TParamIteration[]
  // >;

  // Enable one query at a time, disable all once they've all been processed
  // so new experiments can run sequentially
  const queries: any = iterations.map((params: TParamIteration, i: number) => ({
    queryKey: ["get_inference", params],
    queryFn: () => get_inference(params),
    enabled: i === 0 || (i <= noCompleted && noCompleted !== iterations.length),
    staleTime: 0,
    cacheTime: 0,
  }));

  const results = useQueries({ queries: queries });

  const lastFetched = results.filter((r) => r.isFetched);

  useEffect(() => {
    setNoCompleted(lastFetched.length);
  }, [lastFetched]);

  if (gridParams.models.length === 0 || gridParams.prompt.trim().length === 0) {
    return <>Tutorial</>;
  }

  return (
    <div>
      <div className="sticky top-0 bg-white dark:bg-zinc-950 z-50 pb-4">
        <div className="flex gap-2 my-4">
          <Button
            variant="ghost"
            size="tight"
            onClick={() => setExpandParams(!expandParams)}
          >
            {expandParams ? (
              <>
                <ChevronUpIcon className="h-5 w-5 m-1 text-black dark:text-gray-600" />
                Hide Inference parameters
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-5 w-5 m-1 text-black dark:text-gray-600" />
                Expand Inference parameters
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="tight"
            onClick={() => setExpandMetadata(!expandMetadata)}
          >
            {expandMetadata ? (
              <>
                <ChevronUpIcon className="h-5 w-5 m-1 text-black dark:text-gray-600" />
                Hide Inference metadata
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-5 w-5 m-1 text-black dark:text-gray-600" />
                Expand Inference metadata
              </>
            )}
          </Button>
        </div>

        <Separator className="my-4" />
        <div>
          <div>Experiment started on {start}.</div>
          <div>
            Iterations: {noCompleted}/{iterations.length}
          </div>
        </div>
      </div>

      <div id="results-list" className="py-2 my-4 overflow-y-auto">
        {/* <pre>{JSON.stringify(iterations, null, 2)}</pre> */}
        {/* map iterations, not results.. use cached query inside component */}
        {iterations.map((iteration: TParamIteration, idx: number) => (
          <div key={idx}>
            <IterationResult
              iterationIndex={idx}
              totalIterations={iterations.length}
              params={iteration}
              prompt={gridParams.prompt}
              expandParams={expandParams}
              expandMetadata={expandMetadata}
            />
          </div>
        ))}
        {/* {results.map((result: any, i: number) => (
          <pre key={i}>{JSON.stringify(result, null, 2)}</pre>
        ))} */}
      </div>
    </div>
  );
}
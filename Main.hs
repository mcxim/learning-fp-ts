module Main where

import           Control.Monad (forever)
import           Data.Char     (toLower)
import           Data.List     (intersperse)
import           Data.Maybe    (fromMaybe, isJust)
import           System.Exit   (exitSuccess)
import           System.Random (randomRIO)

newtype WordList =
  WordList [String]
  deriving (Eq, Show)

-- Gets list of words from file.
allWords :: IO WordList
allWords = do
  dict <- readFile "data/dict.txt"
  return $ WordList (lines dict)

minWordLength = 5 :: Int

maxWordLength = 9 :: Int

-- Returns the list of only the words that have acceptable length.
gameWords :: IO WordList
gameWords = do
  (WordList aw) <- allWords
  return $ WordList (filter gameLength aw)
  where
    gameLength w =
      let l = length w
       in l > minWordLength && l < maxWordLength

-- Returns a random word from a word list.
randomWord :: WordList -> IO String
randomWord (WordList wl) = do
  randomIndex <- randomRIO (0, length wl - 1)
  return $ wl !! randomIndex

-- Returns a random word from the word list.
randomWord' :: IO String
randomWord' = gameWords >>= randomWord

data Puzzle =
  Puzzle String [Maybe Char] [Char]

instance Show Puzzle where
  show (Puzzle _ discovered guessed) =
    "So far you know: " ++
    (intersperse ' ' $ map (fromMaybe '_') discovered) ++
    "\nGuessed so far: " ++ guessed

freshPuzzle :: String -> Puzzle
freshPuzzle word = Puzzle word (take (length word) $ repeat Nothing) ""

charInWord :: Puzzle -> Char -> Bool
charInWord (Puzzle word _ _) char = char `elem` word

alreadyGuessed :: Puzzle -> Char -> Bool
alreadyGuessed (Puzzle _ _ guessed) char = char `elem` guessed

fillInCharacter :: Puzzle -> Char -> Puzzle
fillInCharacter (Puzzle word filledInSoFar s) c =
  Puzzle word filledInSoFar' (c : s)
  where
    filledInSoFar' = zipWith (zipper c) word filledInSoFar
    zipper guessed wordChar guessChar =
      if wordChar == guessed
        then Just wordChar
        else guessChar

handleGuess :: Puzzle -> Char -> IO Puzzle
handleGuess puzzle guess = do
  putStrLn $ "Your guess is: " ++ [guess]
  case (charInWord puzzle guess, alreadyGuessed puzzle guess) of
    (_, True) -> do
      putStrLn "Character already guessed... Try something else."
      return puzzle
    (True, _) -> do
      putStrLn "Good guess! Filling accordingly."
      return $ fillInCharacter puzzle guess
    (False, _) -> do
      putStrLn "Nope, not in the word."
      return $ fillInCharacter puzzle guess

gameOver :: Puzzle -> IO ()
gameOver (Puzzle word _ guessed) =
  if length guessed > 17
    then do
      putStrLn $ "You Lose!\nThe word was: " ++ word
      exitSuccess
    else do
      return ()

gameWin :: Puzzle -> IO ()
gameWin (Puzzle _ filledInSoFar _) =
  if all isJust filledInSoFar
    then do
      putStrLn "You win!!!"
      exitSuccess
    else return ()

runGame :: Puzzle -> IO ()
runGame puzzle =
  forever $ do
    gameWin puzzle
    gameOver puzzle
    print puzzle
    putStr "Guess a letter: "
    guess <- getLine
    case guess of
      c:_ -> handleGuess puzzle (toLower c) >>= runGame
      _   -> putStrLn "Your try must be a single character."

main :: IO ()
main = do
  word <- randomWord'
  let puzzle = freshPuzzle word
  runGame puzzle

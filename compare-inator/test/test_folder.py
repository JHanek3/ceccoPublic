import unittest
import os
from index import *

# python -m unittest test
class TestFolders(unittest.TestCase):
    def test_GetAllInFolder1(self):
        """
        Test to verify all files are read in Folder1
        """
        # Will need to hide this before commit
        basepath = os.getcwd() + "\\folder1"
        self.assertEqual(GetAllInFolder(basepath), ['\\1.txt', '\\both.txt', '\\subBothFolder\\subBoth.txt', '\\subBothFolder\\subBoth1.txt', '\\subFolder1\\sub1.txt'])
    
    def test_GetAllInFolder2(self):
        """
        Test to verify all files are read in Folder2
        """
        basepath = os.getcwd() + "\\folder2"
        self.assertEqual(GetAllInFolder(basepath), ['\\2.txt', '\\both.txt', '\\subBothFolder\\subBoth.txt', '\\subBothFolder\\subBoth2.txt', '\\subFolder2\\sub2.txt'])
    
    def test_CompareLists(self):
        """
        Test to verify the correct different files are returned, should expect not to see both.txt
        """
        basepath1 = os.getcwd() + "\\folder1"
        basepath2 = os.getcwd() + "\\folder2"
        files1 = GetAllInFolder(basepath1)
        files2 = GetAllInFolder(basepath2)
        
        self.assertEqual(CompareLists(files1, files2), (['\\1.txt', '\\subBothFolder\\subBoth1.txt', '\\subFolder1\\sub1.txt'], ['\\2.txt', '\\subBothFolder\\subBoth2.txt', '\\subFolder2\\sub2.txt']))
        
if __name__ == "__main__":
    unittest.main()